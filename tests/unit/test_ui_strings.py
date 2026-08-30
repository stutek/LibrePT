"""Unit tests for agent_tools/ui_strings.py — the ratchet on untranslated interface text.

Reported 2026-08-30 as "gumb cancel se pojavi na slovenski izvedbi", which turned out not to be a
missing translation at all: the dictionaries are in exact parity, and the English is written into
the markup. There are hundreds of them, so this is a ratchet rather than a gate — what it has to get
right is which direction it holds, and what it counts as already fixed.
"""

from agent_tools import ui_strings


def test_text_between_tags_counts():
    assert ui_strings.literals_in("`<button>Save Client</button>`") == 1
    assert ui_strings.literals_in("`<h3>Add New Client</h3>`") == 1


def test_an_element_that_names_its_key_is_already_translated():
    """The attribute IS the fix (i18n/domMappings.js applies it), so counting the English left in the
    markup beside it would punish the repair — the words there are a fallback for a missing key."""
    assert (
        ui_strings.literals_in('`<button data-i18n="save_client">Save Client</button>`')
        == 0
    )


def test_the_attributes_a_person_reads_or_hears_count():
    assert ui_strings.literals_in('`<input placeholder="e.g. Jane Doe">`') == 1
    assert ui_strings.literals_in('`<button aria-label="Close modal"></button>`') == 1
    # …and their translated twins cancel out, the same way.
    assert (
        ui_strings.literals_in(
            '`<input placeholder="e.g. Jane Doe" data-i18n-placeholder="client_name_placeholder">`'
        )
        == 0
    )


def test_an_interpolated_value_is_not_a_string_to_translate():
    """`${client.name}` is a person's name, not copy."""
    assert ui_strings.literals_in("`<h3>${client.name}</h3>`") == 0


def test_a_bare_token_is_not_counted():
    """A unit or a taxonomy value reads the same in every language, and demanding a key for "kg"
    would fill the dictionary with noise."""
    assert ui_strings.literals_in("`<span>kg</span>`") == 0


def test_the_ratchet_holds_the_repository_where_it_is():
    """Both directions matter: rising means new English was written, and falling means the baseline
    is stale and the ratchet has stopped holding anything."""
    assert ui_strings.main() == 0, (
        "either new hardcoded interface text was added, or the sweep moved and BASELINE did not"
    )
