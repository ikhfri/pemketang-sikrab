import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import LoginPage from "../pages/LoginPage.vue";
import VotingPage from "../pages/VotingPage.vue";
import ThanksPage from "../pages/ThanksPage.vue";
import AdminPage from "../pages/AdminPage.vue";
import ResultsPage from "../pages/ResultsPage.vue";
import { api } from "../services/api";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomePage },
    { path: "/login", name: "login", component: LoginPage, meta: { guestOnly: true } },
    { path: "/vote", name: "vote", component: VotingPage, meta: { requiresAuth: true, role: "VOTER" } },
{ path: "/thanks", name: "thanks", component: ThanksPage },
    { path: "/admin", name: "admin", component: AdminPage, meta: { requiresAuth: true, role: "ADMIN" } },
    { path: "/admin/results", name: "results", component: ResultsPage, meta: { requiresAuth: true, role: "ADMIN" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;
  try {
    const response = await api.me();
    const role = String(response.user?.role ?? "").toUpperCase();
    if (to.meta.guestOnly) return role === "ADMIN" ? "/admin" : "/vote";
    if (to.meta.role && role !== to.meta.role) return role === "ADMIN" ? "/admin" : "/vote";
    return true;
  } catch {
    if (to.meta.requiresAuth) return "/login";
    return true;
  }
});

export default router;
