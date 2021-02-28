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

# vector
from pyshader.vec import Vec3

# Limits for the raymarch method
MIN_DIST = 0.001
MAX_DIST = 100.0
MAX_STEPS = int(128)


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
