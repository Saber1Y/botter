"""Unit tests for exact token unit conversion used by the payment executor."""
import pytest

from executor import to_token_units


def test_whole_amount():
    assert to_token_units(1) == 1_000_000
    assert to_token_units(2.5) == 2_500_000


def test_tenth_is_exact():
    assert to_token_units(0.1) == 100_000


def test_smallest_unit():
    assert to_token_units(0.000001) == 1


def test_float_artifact_rounds_down():
    assert to_token_units(33.333333333333336) == 33_333_333
    assert to_token_units(1.9999999) == 1_999_999


def test_string_amount():
    assert to_token_units("0.1") == 100_000
    assert to_token_units("12.5") == 12_500_000


def test_rejects_non_positive():
    with pytest.raises(ValueError):
        to_token_units(0)
    with pytest.raises(ValueError):
        to_token_units(-1)


def test_respects_decimals_argument():
    assert to_token_units(1, decimals=18) == 10**18
