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
    w = 1.0
    sphere = Vec3(0.0, 1.0, 6.0)
    ds = len(p - sphere) - w        # distance to sphere
    dp = p.y                        # distance to point
    d = min(ds, dp)

    return d


# TODO : need to return a list of the various distances as we march towards
# the scene
def ray_march(ro: Vec3, rd: Vec3) -> float:
    d_origin = 0.0

    for step in range(MAX_STEPS):
        p = ro + d_origin * rd
        ds = get_dist(p)
        d_origin += ds
        if ds < MIN_DIST or d_origin > MAX_DIST:
            break

    return d_origin


def render_image(ro: Vec3, width:int, height:int) -> np.ndarray:
    image = np.zeros((width, height))

    for h in range(height):
        for w in range(width):
            # TODO: probably need to get the pixel position in coord space here
            # ...
            pass



def main() -> None:
    height = 240
    width = 320

    camera_pos = Vec3(0.0, 1.0, 0.0)

    image = render_image(camera_pos, width, height)



