const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "https://my-ai-assistant-zmc3.onrender.com";
  if (envUrl && envUrl.trim() !== "") {
    const clean = envUrl.trim().replace(/\/+$/, "").replace(/\/api\/v1$/, "");
    return `${clean}/api/v1`;
  }
  return "https://my-ai-assistant-zmc3.onrender.com/api/v1";
};

const API_BASE_URL = getApiBaseUrl();


export class ApiClient {
  private static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexus_auth_token");
    }
    return null;
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_auth_token", token);
    }
  }

  public static removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexus_auth_token");
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = "Bir hata oluştu.";
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.detail || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth APIs
  static login = (data: any) => this.request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) });
  static register = (data: any) => this.request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) });
  static getMe = () => this.request<any>("/auth/me");
  static updateProfile = (data: any) => this.request<any>("/auth/profile", { method: "PUT", body: JSON.stringify(data) });
  static changePassword = (data: any) => this.request<any>("/auth/password", { method: "PUT", body: JSON.stringify(data) });


  // Chat APIs
  static getModels = () => this.request<any[]>("/chat/models");
  static getConversations = () => this.request<any[]>("/chat/conversations");
  static createConversation = (data: any) => this.request<any>("/chat/conversations", { method: "POST", body: JSON.stringify(data) });
  static getConversation = (id: string) => this.request<any>(`/chat/conversations/${id}`);
  static deleteConversation = (id: string) => this.request<any>(`/chat/conversations/${id}`, { method: "DELETE" });
  static sendMessage = (data: any) => this.request<any>("/chat/messages", { method: "POST", body: JSON.stringify(data) });

  // Code Studio APIs
  static getWorkspaces = () => this.request<any[]>("/code/workspaces");
  static createWorkspace = (data: any) => this.request<any>("/code/workspaces", { method: "POST", body: JSON.stringify(data) });
  static getWorkspaceTree = (wsId: string) => this.request<any[]>(`/code/workspaces/${wsId}/tree`);
  static readFile = (wsId: string, path: string) => this.request<any>(`/code/workspaces/${wsId}/file?path=${encodeURIComponent(path)}`);
  static writeFile = (wsId: string, path: string, content: string) => this.request<any>(`/code/workspaces/${wsId}/file`, {
    method: "POST",
    body: JSON.stringify({ path, content }),
  });
  static executeGit = (wsId: string, data: any) => this.request<any>(`/code/workspaces/${wsId}/git`, { method: "POST", body: JSON.stringify(data) });
  static executeTerminal = (wsId: string, command: string) => this.request<any>(`/code/workspaces/${wsId}/terminal`, {
    method: "POST",
    body: JSON.stringify({ command }),
  });
  static codeAssist = (data: any) => this.request<any>("/code/assist", { method: "POST", body: JSON.stringify(data) });

  // Media Studio APIs
  static getMediaModels = () => this.request<any>("/media/models");
  static getMediaHistory = () => this.request<any[]>("/media/history");
  static generateImage = (data: any) => this.request<any>("/media/generate/image", { method: "POST", body: JSON.stringify(data) });
  static generateVideo = (data: any) => this.request<any>("/media/generate/video", { method: "POST", body: JSON.stringify(data) });

  // Deep Research APIs
  static getResearchTasks = () => this.request<any[]>("/research/tasks");
  static getResearchTask = (id: string) => this.request<any>(`/research/tasks/${id}`);
  static runResearch = (data: any) => this.request<any>("/research/run", { method: "POST", body: JSON.stringify(data) });

  // Vector Memory APIs
  static getMemories = () => this.request<any[]>("/memory/list");
  static addMemory = (data: any) => this.request<any>("/memory/add", { method: "POST", body: JSON.stringify(data) });
  static searchMemories = (data: any) => this.request<any>("/memory/search", { method: "POST", body: JSON.stringify(data) });
  static deleteMemory = (id: string) => this.request<any>(`/memory/${id}`, { method: "DELETE" });

  // Files & Document Generation APIs
  static getDocuments = () => this.request<any[]>("/files/list");
  static uploadDocument = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<any>("/files/upload", { method: "POST", body: formData });
  };
  static generateDocument = (data: any) => this.request<any>("/files/generate", { method: "POST", body: JSON.stringify(data) });
  static directCreateDocument = (data: any) => this.request<any>("/files/create", { method: "POST", body: JSON.stringify(data) });
  static deleteDocument = (id: string) => this.request<any>(`/files/${id}`, { method: "DELETE" });
  static queryDocument = (data: any) => this.request<any>("/files/query", { method: "POST", body: JSON.stringify(data) });
  static getDownloadUrl = (id: string) => `${API_BASE_URL}/files/download/${id}`;


  // Marketplace APIs
  static getMarketplaceAgents = () => this.request<any[]>("/agents/marketplace");
  static createCustomAgent = (data: any) => this.request<any>("/agents/custom", { method: "POST", body: JSON.stringify(data) });
  static executeAgent = (data: any) => this.request<any>("/agents/execute", { method: "POST", body: JSON.stringify(data) });

  // Admin APIs
  static getAdminStats = () => this.request<any>("/admin/stats");
  static getTokenUsage = () => this.request<any[]>("/admin/tokens/by-model");
  static getAdminUsers = (params?: { query?: string; role?: string; status_filter?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append("query", params.query);
    if (params?.role) searchParams.append("role", params.role);
    if (params?.status_filter) searchParams.append("status_filter", params.status_filter);
    const qs = searchParams.toString();
    return this.request<any[]>(`/admin/users${qs ? `?${qs}` : ""}`);
  };
  static createUserAdmin = (data: any) => this.request<any>("/admin/users", { method: "POST", body: JSON.stringify(data) });
  static updateUserPermissions = (userId: string, data: any) => this.request<any>(`/admin/users/${userId}/permissions`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  static resetUserPasswordAdmin = (userId: string, newPassword: string) => this.request<any>(`/admin/users/${userId}/password`, {
    method: "PUT",
    body: JSON.stringify({ new_password: newPassword }),
  });
  static deleteUserAdmin = (userId: string) => this.request<any>(`/admin/users/${userId}`, { method: "DELETE" });

  static getSystemSettings = () => this.request<any>("/admin/settings");
  static updateSystemSettings = (data: any) => this.request<any>("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
  static getProviderHealth = () => this.request<any[]>("/admin/providers");
  static getAuditLogs = (query?: string) => {
    const qs = query ? `?query=${encodeURIComponent(query)}` : "";
    return this.request<any[]>(`/admin/logs${qs}`);
  };
  static clearAuditLogs = () => this.request<any>("/admin/logs/clear", { method: "DELETE" });
  static getPublicConfig = () => this.request<any>("/admin/public-config");

  // Voice, Podcast & Arena APIs
  static generatePodcast = (data: any) => this.request<any>("/voice/podcast", { method: "POST", body: JSON.stringify(data) });
  static runArena = (data: any) => this.request<any>("/voice/arena", { method: "POST", body: JSON.stringify(data) });
  static speakText = (data: any) => this.request<any>("/voice/speak", { method: "POST", body: JSON.stringify(data) });

}
