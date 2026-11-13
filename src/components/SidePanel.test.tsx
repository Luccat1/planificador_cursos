import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SidePanel from "./SidePanel";
import { samplePeriod } from "../test/fixtures";
import "@testing-library/jest-dom";

describe("SidePanel", () => {
  it("prevents placing manual session if course weeklySessions limit is reached", () => {
    // samplePeriod course c3 has weeklySessions: 1, and requirements has r5 for c3
    const onChangePeriod = vi.fn();
    const onClearSelection = vi.fn();

    render(
      <SidePanel
        period={samplePeriod}
        selectedSession={null}
        selectedSlot={{ day: "monday", blockId: "1-2" }}
        onChangePeriod={onChangePeriod}
        onClearSelection={onClearSelection}
      />
    );

    // Select course c3 ("Cultura Chilena")
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "c3" } });

    // Click "Confirmar Ubicación"
    const confirmButton = screen.getByRole("button", { name: /Confirmar Ubicación/i });
    fireEvent.click(confirmButton);

    // Should NOT call onChangePeriod because c3 already has 1 requirement and weeklySessions is 1
    expect(onChangePeriod).not.toHaveBeenCalled();

    // Should display error message
    expect(
      screen.getByText(/ya tiene asignado el máximo permitido de sesiones semanales/i)
    ).toBeInTheDocument();
  });

  it("allows placing manual session if within weeklySessions limit", () => {
    const onChangePeriod = vi.fn();
    const onClearSelection = vi.fn();

    // Period with course c3 having 0 requirements
    const periodWithoutReqs = {
      ...samplePeriod,
      requirements: samplePeriod.requirements.filter(r => r.courseId !== "c3")
    };

    render(
      <SidePanel
        period={periodWithoutReqs}
        selectedSession={null}
        selectedSlot={{ day: "monday", blockId: "1-2" }}
        onChangePeriod={onChangePeriod}
        onClearSelection={onClearSelection}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "c3" } });

    const confirmButton = screen.getByRole("button", { name: /Confirmar Ubicación/i });
    fireEvent.click(confirmButton);

    expect(onChangePeriod).toHaveBeenCalledTimes(1);
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });
});

