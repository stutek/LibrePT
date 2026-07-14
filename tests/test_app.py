import os
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
        if 'id' in attrs_dict:
            self.ids.add(attrs_dict['id'])
        if 'class' in attrs_dict:
            for c in attrs_dict['class'].split():
                self.classes.add(c)
        self.elements.append({
            'tag': tag,
            'attrs': attrs_dict
        })

def test_file_structure():
    assert os.path.exists('index.html')
    assert os.path.exists('app.js')
    assert os.path.exists('index.css')
    assert os.path.exists('mockData.js')

def test_translation_dictionaries_parity():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the TRANSLATIONS object content
    translations_match = re.search(r'const TRANSLATIONS = \{(.*?)\n\};', content, re.DOTALL)
    assert translations_match, "TRANSLATIONS object not found in app.js"
    translations_block = translations_match.group(1)

    # Extract English keys
    en_match = re.search(r'en:\s*\{(.*?)\n\s*\},', translations_block, re.DOTALL)
    assert en_match, "English translations block not found"
    en_block = en_match.group(1)
    en_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+)\s*:', en_block, re.MULTILINE))

    # Extract Slovenian keys
    sl_match = re.search(r'sl:\s*\{(.*?)\n\s*\}', translations_block, re.DOTALL)
    assert sl_match, "Slovenian translations block not found"
    sl_block = sl_match.group(1)
    sl_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+)\s*:', sl_block, re.MULTILINE))

    assert len(en_keys) > 0, "No English keys found"
    assert len(sl_keys) > 0, "No Slovenian keys found"

    # Assert matching keys in both dictionaries
    missing_in_sl = en_keys - sl_keys
    missing_in_en = sl_keys - en_keys

    assert not missing_in_sl, f"Keys defined in English but missing in Slovenian: {missing_in_sl}"
    assert not missing_in_en, f"Keys defined in Slovenian but missing in English: {missing_in_en}"

def test_static_mappings_selectors():
    # Parse index.html to gather all DOM elements
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    collector = ElementCollector()
    collector.feed(html_content)

    # Read app.js
    with open('app.js', 'r', encoding='utf-8') as f:
        js_content = f.read()

    # Extract staticMappings block
    mappings_match = re.search(r'const staticMappings = \{(.*?)\};', js_content, re.DOTALL)
    assert mappings_match, "staticMappings object not found in app.js"
    mappings_block = mappings_match.group(1)

    # Find all mapping selectors (e.g. '#btn-add-client': 'btn_add_client')
    mappings = re.findall(r"'\s*([^']+)\s*':\s*'([^']+)'", mappings_block)
    assert len(mappings) > 0, "No static mappings parsed"

    # Parse and validate each selector against the index.html DOM collector
    for selector, key in mappings:
        # Simple ID check (e.g., #btn-add-client)
        if selector.startswith('#') and ' ' not in selector and '[' not in selector:
            element_id = selector[1:]
            assert element_id in collector.ids, f"Selector ID '{element_id}' referenced in app.js mappings does not exist in index.html"
        
        # Simple Class check (e.g., .logo-area)
        elif selector.startswith('.') and ' ' not in selector:
            class_name = selector[1:]
            assert class_name in collector.classes, f"Selector Class '{class_name}' referenced in app.js mappings does not exist in index.html"
        
        # Sub-selector with spaces (e.g., '#view-clients .section-title h3')
        elif ' ' in selector:
            parts = selector.split()
            root_id = parts[0]
            if root_id.startswith('#'):
                element_id = root_id[1:]
                assert element_id in collector.ids, f"Root selector ID '{element_id}' in '{selector}' does not exist in index.html"
        
        # Attributes check (e.g., 'button[data-view="clients"] span')
        elif 'data-view' in selector:
            view_match = re.search(r'data-view="([^"]+)"', selector)
            if view_match:
                view_val = view_match.group(1)
                has_element = any(el['tag'] == 'button' and el['attrs'].get('data-view') == view_val for el in collector.elements)
                assert has_element, f"Element matching 'button[data-view=\"{view_val}\"]' not found in index.html"

def test_mock_data_structure():
    with open('mockData.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Basic exports presence checks
    assert 'export const DEFAULT_EXERCISES' in content
    assert 'export const DEFAULT_CLIENTS' in content
    assert 'export const DEFAULT_ROUTINES' in content
    assert 'export const DEFAULT_HISTORY' in content
    assert 'export const DEFAULT_PLAN_UPDATES' in content
    assert 'export const DEFAULT_SESSIONS' in content
