"""Unit tests for exact token unit conversion used by the payment executor."""
from types import SimpleNamespace

import pytest

import executor
from executor import PaymentExecutor, to_token_units


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


def test_executor_can_read_without_signer_but_cannot_submit_payment(monkeypatch):
    monkeypatch.setattr(
        executor,
        "get_settings",
        lambda: SimpleNamespace(
            bot_chain_rpc="https://rpc.botchain.ai",
            bot_chain_id=677,
            agent_private_key="",
            token_contract_address="0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
            vault_factory_address="0xfebcdda771561bc92d290c993e07aa8552083a61",
        ),
    )

    instance = PaymentExecutor()

    assert instance.agent_account is None
    with pytest.raises(RuntimeError, match="Payment signing is disabled"):
        instance.execute_payment(
            vault_address="0xA9BAe94474D77d22098a770655200faa75F5eC67",
            recipient="0x0000000000000000000000000000000000000001",
            amount=1,
            payment_id="read-only-test",
        )
