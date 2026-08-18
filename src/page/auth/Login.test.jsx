import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./Login";

const login = vi.fn();
const signup = vi.fn();

vi.mock("../../store/authStore", () => ({
  default: () => ({
    login,
    signup,
    loading: false,
    error: null,
    user: null,
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("renders the sign-in form with labeled fields", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("marks phone and password as required", () => {
    renderLogin();

    expect(screen.getByLabelText(/phone number/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
  });

  it("rejects signup when passwords do not match", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /create one/i }));
    await user.type(screen.getByLabelText(/username/i), "ada");
    await user.type(screen.getByLabelText(/phone number/i), "911");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it("submits login credentials when the form is valid", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/phone number/i), "911");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith({
      phone: "911",
      password: "secret",
      role: "PLAYER",
    });
  });
});
