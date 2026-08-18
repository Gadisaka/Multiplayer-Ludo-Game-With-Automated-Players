import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import useAuthStore from "./authStore";

vi.mock("axios");

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  });

  it("stores the user and token after a successful login", async () => {
    axios.post.mockResolvedValue({
      data: { user: { id: "1", username: "ada" }, token: "jwt-token" },
    });

    await useAuthStore.getState().login({
      phone: "911",
      password: "secret",
      role: "PLAYER",
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      { phone: "911", password: "secret", role: "PLAYER" }
    );
    expect(useAuthStore.getState().user).toEqual({
      id: "1",
      username: "ada",
    });
    expect(useAuthStore.getState().token).toBe("jwt-token");
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("records a server error without creating a session", async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: "Invalid credentials" } },
    });

    await useAuthStore.getState().login({
      phone: "911",
      password: "wrong",
      role: "PLAYER",
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().error).toBe("Invalid credentials");
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("clears the session on logout", () => {
    useAuthStore.setState({
      user: { id: "1", username: "ada" },
      token: "jwt-token",
    });
    localStorage.setItem("auth-storage", JSON.stringify({ state: { token: "jwt-token" } }));

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    const persisted = JSON.parse(localStorage.getItem("auth-storage"));
    expect(persisted.state.user).toBeNull();
    expect(persisted.state.token).toBeNull();
  });
});
