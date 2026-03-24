export type DaycareCenterDisplayInput =
  | string
  | {
    name?: unknown;
    barangay?: unknown;
  }
  | null
  | undefined;

const normalize = (value: unknown): string => String(value ?? "").trim();

export const getDaycareCenterDisplay = (value: DaycareCenterDisplayInput) => {
  if (typeof value === "string") {
    const text = normalize(value);
    if (text) {
      return { primary: text, secondary: "" };
    }
    return { primary: "No center assigned", secondary: "" };
  }

  if (value && typeof value === "object") {
    const name = normalize(value.name);
    const barangay = normalize(value.barangay);

    if (name) {
      const secondary =
        barangay && name.toLowerCase() !== barangay.toLowerCase()
          ? barangay
          : "";
      return { primary: name, secondary };
    }

    if (barangay) {
      return { primary: barangay, secondary: "" };
    }
  }

  return { primary: "No center assigned", secondary: "" };
};

