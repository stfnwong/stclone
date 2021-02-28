"""
RAY MARCH
Illustration of ray marching process

This is just to show what happens during ray marching. Its way too slow
to be useful for actual rendering.
"""

import numpy as np
from matplotlib import pyplot as plt
from dataclasses import dataclass
from typing import Any, Union

# Limits for the raymarch method
MIN_DIST = 0.001
MAX_DIST = 100.0
MAX_STEPS = int(128)


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
            self.x = self.x * that
            self.y = self.y * that
            self.x = self.z * that
        elif isinstance(that, Vec3):
            self.x = self.x * that.x
            self.y = self.y * that.y
            self.z = self.z * that.z
        else:
            raise ValueError("LHS must be float or Vec3")

    def __div__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            self.x = self.x / that
            self.y = self.y / that
            self.x = self.z / that
        elif isinstance(that, Vec3):
            self.x = self.x / that.x
            self.y = self.y / that.y
            self.z = self.z / that.z
        else:
            raise ValueError("LHS must be float or Vec3")

    def __add__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            self.x = self.x + that
            self.y = self.y + that
            self.z = self.z + that
        elif isinstance(that, Vec3):
            self.x = self.x + that.x
            self.y = self.y + that.y
            self.z = self.z + that.z
        else:
            raise ValueError("LHS must be float or Vec3")

    def __sub__(self, that: Union[float, "Vec3"]) -> "Vec3":
        if isinstance(that, float):
            self.x = self.x - that
            self.y = self.y - that
            self.z = self.z - that
        elif isinstance(that, Vec3):
            self.x = self.x - that.x
            self.y = self.y - that.y
            self.z = self.z - that.z
        else:
            raise ValueError("LHS must be float or Vec3")




# Distance function of a sphere
def get_dist(p: Vec3) -> float:
    pass


def ray_march(ro: Vec3, rd: Vec3) -> float:
    d_origin = 0.0

    for step in range(MAX_STEPS):
        p = ro + d_origin * rd
        ds = get_dist(p)
        d_origin += ds
        if ds < MIN_DIST or d_origin > MAX_DIST:
            break

    return d_origin
