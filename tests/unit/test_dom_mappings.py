# tests/unit/test_dom_mappings.py
# Every selector in app.js's staticMappings (i18n target table) must resolve to an element
# that actually exists in index.html — a typo'd selector silently drops a translation.

import re
from html.parser import HTMLParser


class ElementCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.ids = set()
        self.classes = set()
        self.tags = set()

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self.tags.add(tag)
        if "id" in attrs_dict:
            self.ids.add(attrs_dict["id"])
        if "class" in attrs_dict:
            for c in attrs_dict["class"].split():
                self.classes.add(c)
        self.elements.append({"tag": tag, "attrs": attrs_dict})


def test_static_mappings_selectors(src_dir):
    collector = ElementCollector()
    collector.feed((src_dir / "index.html").read_text(encoding="utf-8"))

    js_content = (src_dir / "i18n" / "domMappings.js").read_text(encoding="utf-8")
    mappings_match = re.search(r"const staticMappings = \{(.*?)\};", js_content, re.DOTALL)
    assert mappings_match, "staticMappings object not found in domMappings.js"

    mappings = re.findall(r"'\s*([^']+)\s*':\s*'([^']+)'", mappings_match.group(1))
    assert mappings, "No static mappings parsed"

    for selector, key in mappings:
        # Simple ID check (e.g. #btn-add-client)
        if selector.startswith("#") and " " not in selector and "[" not in selector:
            element_id = selector[1:]
            assert element_id in collector.ids, f"Selector ID '{element_id}' in app.js mappings not in index.html"

        # Simple class check (e.g. .logo-area)
        elif selector.startswith(".") and " " not in selector:
            class_name = selector[1:]
            assert class_name in collector.classes, f"Selector class '{class_name}' in app.js mappings not in index.html"

        # Descendant selector (e.g. '#view-clients .section-title h3')
        elif " " in selector:
            root_id = selector.split()[0]
            if root_id.startswith("#"):
                element_id = root_id[1:]
                assert element_id in collector.ids, f"Root selector ID '{element_id}' in '{selector}' not in index.html"

        # Attribute selector (e.g. 'button[data-view="clients"] span')
        elif "data-view" in selector:
            view_match = re.search(r'data-view="([^"]+)"', selector)
            if view_match:
                view_val = view_match.group(1)
                has_element = any(
                    el["tag"] == "button" and el["attrs"].get("data-view") == view_val
                    for el in collector.elements
                )
                assert has_element, f'Element matching button[data-view="{view_val}"] not found in index.html'
