export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) {
    const user = localStorage.getItem("user");
    if (!user) {
      return navigateTo("/signin");
    }
  }
});
