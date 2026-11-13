import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import "@testing-library/jest-dom";

describe("UI Integration", () => {
  it("renders the main planner title and core buttons", () => {
    render(<App />);
    expect(screen.getByText(/Planificador de cursos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar propuesta/i })).toBeInTheDocument();
    expect(screen.getByText(/Lunes/i)).toBeInTheDocument();
  });

  it("generates schedule proposals on button click", async () => {
    window.alert = vi.fn();
    render(<App />);
    const generateBtn = screen.getByRole("button", { name: /Generar propuesta/i });
    fireEvent.click(generateBtn);

    const proposals = await screen.findAllByText(/Propuesta Recomendada/i);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
  });
});
