"""
Some tests for the ray marching example
"""

from pyshader.ray_march import Vec3



class TestVec3:
    def test_vec3_init(self) -> None:
        v1 = Vec3()
        assert v1.x == 0.0
        assert v1.y == 0.0
        assert v1.z == 0.0

        # Equal works here since there is an exact representation of 1
        v2 = Vec3(1.0, 1.0, 1.0)
        assert v2.x == 1.0
        assert v2.y == 1.0
        assert v2.z == 1.0

    def test_vec3_add(self) -> None:
        v1 = Vec3(1.0, 1.0, 1.0)
        v2 = Vec3(1.0, 1.0, 1.0)

        from pudb import set_trace; set_trace()

        v3 = v1 + v2
        assert v3 == Vec3(2.0, 2.0, 2.0)
