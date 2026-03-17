from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Forward all /api/ traffic to the api folder
    path("api/", include("api.urls")),
]
