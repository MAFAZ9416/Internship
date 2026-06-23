import io
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class AvatarUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/auth/profile/"

    def create_in_memory_image(self, filename, format_name, content_type):
        file_bytes = io.BytesIO()
        image = Image.new('RGB', (10, 10), color='blue')
        image.save(file_bytes, format=format_name)
        file_bytes.seek(0)
        return SimpleUploadedFile(filename, file_bytes.read(), content_type=content_type)

    def test_upload_valid_jpeg(self):
        image = self.create_in_memory_image("avatar.jpg", "JPEG", "image/jpeg")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)
        self.assertTrue(response.data["avatar"].startswith("http://testserver/"))

    def test_upload_valid_png(self):
        image = self.create_in_memory_image("avatar.png", "PNG", "image/png")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)
        self.assertTrue(response.data["avatar"].startswith("http://testserver/"))

    def test_upload_valid_webp(self):
        image = self.create_in_memory_image("avatar.webp", "WEBP", "image/webp")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)
        self.assertTrue(response.data["avatar"].startswith("http://testserver/"))

    def test_upload_large_file_fails(self):
        # Create a file slightly over 5MB
        large_data = b"x" * (5 * 1024 * 1024 + 1024)
        large_file = SimpleUploadedFile("large_image.jpg", large_data, content_type="image/jpeg")
        response = self.client.patch(self.url, {"avatar": large_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "File size exceeds the maximum limit of 5MB.")

    def test_upload_unsupported_mimetype_fails(self):
        # GIF is not in allowed_types: ["image/jpeg", "image/png", "image/webp"]
        image = self.create_in_memory_image("avatar.gif", "GIF", "image/gif")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "Only JPG, PNG and WEBP files are allowed.")

    def test_upload_spoofed_pdf_fails(self):
        spoofed_file = SimpleUploadedFile("avatar.jpg", b"%PDF-1.4 dummy pdf content", content_type="image/jpeg")
        response = self.client.patch(self.url, {"avatar": spoofed_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "Only JPG, PNG and WEBP files are allowed.")

    def test_upload_spoofed_zip_fails(self):
        spoofed_file = SimpleUploadedFile("avatar.png", b"PK\x03\x04 dummy zip content", content_type="image/png")
        response = self.client.patch(self.url, {"avatar": spoofed_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "Only JPG, PNG and WEBP files are allowed.")

    def test_upload_spoofed_mp4_fails(self):
        spoofed_file = SimpleUploadedFile("avatar.webp", b"\x00\x00\x00\x18ftypmp42 dummy video", content_type="image/webp")
        response = self.client.patch(self.url, {"avatar": spoofed_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "Only JPG, PNG and WEBP files are allowed.")

    def test_upload_spoofed_docx_fails(self):
        spoofed_file = SimpleUploadedFile("avatar.jpg", b"PK\x03\x04 dummy docx content", content_type="image/jpeg")
        response = self.client.patch(self.url, {"avatar": spoofed_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
        self.assertEqual(response.data["avatar"][0], "Only JPG, PNG and WEBP files are allowed.")

    def test_patch_without_avatar_preserves(self):
        # Set an avatar first
        image = self.create_in_memory_image("avatar.jpg", "JPEG", "image/jpeg")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)

        # PATCH other fields without avatar
        response = self.client.patch(self.url, {"bio": "New bio info"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)
        self.assertEqual(self.user.profile.bio, "New bio info")

    def test_patch_null_avatar_clears(self):
        # Set an avatar first
        image = self.create_in_memory_image("avatar.jpg", "JPEG", "image/jpeg")
        response = self.client.patch(self.url, {"avatar": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.avatar)

        # PATCH avatar to null using JSON format
        response = self.client.patch(self.url, {"avatar": None}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.avatar)

    def test_login_returns_absolute_avatar_url(self):
        # First set the avatar
        image = self.create_in_memory_image("avatar.jpg", "JPEG", "image/jpeg")
        self.client.patch(self.url, {"avatar": image}, format="multipart")
        
        # Now login
        self.client.force_authenticate(user=None) # clear authentication first
        login_url = "/api/auth/login/"
        response = self.client.post(login_url, {
            "email": "testuser@example.com",
            "password": "testpassword123"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["user"]["avatar"].startswith("http://testserver/"))


class AdminAPITests(APITestCase):
    def setUp(self):
        # Create normal user
        self.normal_user = User.objects.create_user(
            username="normal@example.com",
            email="normal@example.com",
            password="password123"
        )
        
        # Create staff user
        self.admin_user = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="password123",
            is_staff=True
        )

    def test_stats_endpoint_rejects_normal_user(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stats_endpoint_allows_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("stats", response.data)
        self.assertIn("total_users", response.data["stats"])
        self.assertIn("weekly_stats", response.data)

    def test_users_list_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 2) # normal_user and admin_user

    def test_delete_user_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        delete_url = f"/api/admin/users/{self.normal_user.id}/"
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.normal_user.id).exists())
