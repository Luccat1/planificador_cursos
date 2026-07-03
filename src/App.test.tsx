import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import "@testing-library/jest-dom";

describe("UI Smoke Test", () => {
  it("renders the main planner title and core buttons", () => {
    render(<App />);
    expect(screen.getByText(/Planificador de cursos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar propuesta/i })).toBeInTheDocument();
    expect(screen.getByText(/Lunes/i)).toBeInTheDocument();
  });
});
