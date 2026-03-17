from django.urls import path

from . import views

urlpatterns = [
    # User Management
    path("users/register", views.register_user),
    path("users", views.get_users),
    path("users/<str:user_id>/history", views.user_history),
    path("users/reset", views.reset_users),
    # Recommendations & Feed
    path("onboarding", views.get_onboarding),
    path("recommend/profile", views.recommend_profile),
    path("recommend/<str:paper_id>", views.recommend_paper),
]
