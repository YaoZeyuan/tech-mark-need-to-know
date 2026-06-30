import { createRouter, createWebHistory } from "vue-router";
import OverviewView from "./views/OverviewView.vue";
import RoleView from "./views/RoleView.vue";
import DecisionBookView from "./views/DecisionBookView.vue";
import ReportsView from "./views/ReportsView.vue";
import PromptsView from "./views/PromptsView.vue";
import SettingsView from "./views/SettingsView.vue";
import ReadmeView from "./views/ReadmeView.vue";
import type { RoleKey } from "./domain/types";

const roleRoute = (path: string, role: RoleKey) => ({
  path,
  component: RoleView,
  props: { role },
});

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: OverviewView },
    roleRoute("/ceo", "ceo"),
    roleRoute("/cmo", "cmo"),
    roleRoute("/coo", "coo"),
    roleRoute("/cfo", "cfo"),
    roleRoute("/cto", "cto"),
    { path: "/decision-book", component: DecisionBookView },
    { path: "/reports", component: ReportsView },
    { path: "/prompts", component: PromptsView },
    { path: "/settings", component: SettingsView },
    { path: "/readme", component: ReadmeView },
  ],
});
