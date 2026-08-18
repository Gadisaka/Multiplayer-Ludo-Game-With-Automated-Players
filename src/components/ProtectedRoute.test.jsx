import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import useAuthStore from "../store/authStore";

vi.mock("../store/authStore", () => ({
  default: vi.fn(),
}));

function renderWithAuth(user, initialPath = "/game") {
  useAuthStore.mockReturnValue({ user });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/game" element={<div>Game page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("sends guests to login", () => {
    renderWithAuth(null);

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Game page")).not.toBeInTheDocument();
  });

  it("renders the protected page for an authenticated user", () => {
    renderWithAuth({ id: "1", username: "ada" });

    expect(screen.getByText("Game page")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
