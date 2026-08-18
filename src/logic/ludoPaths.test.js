import { describe, expect, it } from "vitest";
import {
  allPath,
  blueHomePath,
  greenHomePath,
  ludoBoxCoordinates,
  paths,
  redHomePath,
  yellowHomePath,
} from "./ludoPaths";

describe("ludoPaths", () => {
  it("defines a path for each color", () => {
    expect(Object.keys(paths).sort()).toEqual(
      ["blue", "green", "red", "yellow"].sort()
    );
  });

  it("gives every color a full board path plus home stretch", () => {
    for (const [color, path] of Object.entries(paths)) {
      expect(path.length).toBeGreaterThanOrEqual(52);
      expect(new Set(path).size).toBe(path.length);
      expect(paths[color][0]).toBeTruthy();
    }
  });

  it("keeps a five-square home path for each color", () => {
    expect(redHomePath).toHaveLength(5);
    expect(greenHomePath).toHaveLength(5);
    expect(blueHomePath).toHaveLength(5);
    expect(yellowHomePath).toHaveLength(5);
  });

  it("has coordinates for every board and home square", () => {
    const squares = new Set([
      ...allPath,
      ...redHomePath,
      ...greenHomePath,
      ...blueHomePath,
      ...yellowHomePath,
      ...Object.values(paths).flat(),
    ]);

    for (const square of squares) {
      expect(ludoBoxCoordinates[square], square).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    }
  });
});
