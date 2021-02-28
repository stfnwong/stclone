from dataclasses import dataclass
from typing import Union


def equal(a: float, b: float, eps:float=1e-6) -> bool:
    return True if abs(a - b) < eps else False


@dataclass(init=True)
class Vec3:
    x :float = 0.0
    y :float = 0.0
    z :float = 0.0

    def __eq__(self, that: "Vec3") -> bool:
        if isinstance(that, Vec3):
            if not equal(self.x, that.x):
                return False
            if not equal(self.y, that.y):
                return False
            if not equal(self.z, that.z):
                return False
            return True
        else:
            return False

    def __mul__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            return Vec3(
                self.x * that,
                self.y * that,
                self.z * that,
            )
        elif isinstance(that, Vec3):
            return Vec3(
                self.x * that.x,
                self.y * that.y,
                self.z * that.z
            )
        else:
            raise ValueError("LHS must be float or Vec3")

    def __div__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            return Vec3(
                self.x / that,
                self.y / that,
                self.z / that
            )
        elif isinstance(that, Vec3):
            return Vec3(
                self.x / that.x,
                self.y / that.y,
                self.z / that.z
            )
        else:
            raise ValueError("LHS must be float or Vec3")

    def __add__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            return Vec3(
                self.x + that,
                self.y + that,
                self.z + that
            )
        elif isinstance(that, Vec3):
            return Vec3(
                self.x + that.x,
                self.y + that.y,
                self.z + that.z,
            )
        else:
            raise ValueError("LHS must be float or Vec3")

    def __sub__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            return Vec3(
                self.x - that,
                self.y - that,
                self.z - that
            )
        elif isinstance(that, Vec3):
            return Vec3(
                self.x - that.x,
                self.y - that.y,
                self.z - that.z
            )
        else:
            raise ValueError("LHS must be float or Vec3")




