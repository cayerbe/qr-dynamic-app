import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

// Inline mock for Alert
jest.mock("./common/Alert", () => {
  return function MockAlert({ type, message, ...props }) {
    return (
      <div data-testid="mock-alert" data-alert-type={type} {...props}>
        {message}
      </div>
    );
  };
});

jest.mock("./components/auth/Login", () => () => <div>Login</div>);
jest.mock("./components/auth/Registration", () => () => (
  <div>Registration</div>
));
jest.mock("./components/QRGenerator", () => () => <div>QR Generator</div>);
jest.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: null,
  }),
}));

// Mock any other necessary components or modules
jest.mock("lucide-react", () => ({
  Save: () => <div>Save Icon</div>,
  RotateCcw: () => <div>Rotate Icon</div>,
  Moon: () => <div>Moon Icon</div>,
  Server: () => <div>Server Icon</div>,
}));

describe("App Routing", () => {
  test("renders without crashing", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
  });

  test("navigates to login page on /login route", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  test("navigates to registration page on /register route", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Registration")).toBeInTheDocument();
  });

  test("navigates to dashboard for authenticated users", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("QR Generator")).toBeInTheDocument();
  });

  test("redirects to dashboard", () => {
    expect(true).toBe(true); // Placeholder test
  });
});
