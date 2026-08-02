# tests/e2e/test_drive_app_data.py
# Google Drive appDataFolder REST client (TODO §1.5/§3.3, src/data/driveAppData.js). Every call takes
# an injectable `fetchImpl`, so these pin the request SHAPE (method, URL, headers, body) against a
# stub with no real network call or access token — never against the live Drive API. Run in-browser
# like every other pure-module test in this suite (see test_record_id.py for why: the app's CSP
# forbids `new Function`, so there is no eval-based test harness available).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE_SCRIPT = """
async () => {{
    const url = new URL('data/driveAppData.js', document.baseURI).href;
    const m = await import(url);
    {body}
}}
"""


def _run(page, local_server, body):
    page.goto(local_server)
    page.wait_for_timeout(300)
    return page.evaluate(MODULE_SCRIPT.format(body=body))


def test_find_sync_file_scopes_the_query_to_appdatafolder_and_the_filename(
    page, local_server
):
    r = _run(
        page,
        local_server,
        """
        let seen = null;
        const fetchImpl = async (url, options) => {
            seen = { url, options };
            return {
                ok: true,
                json: async () => ({ files: [{ id: 'file123', modifiedTime: '2026-08-01T00:00:00Z' }] }),
            };
        };
        const file = await m.findSyncFile('tok-abc', { fetchImpl });
        return { file, url: seen.url, authHeader: seen.options.headers.Authorization };
        """,
    )
    assert r["file"] == {"id": "file123", "modifiedTime": "2026-08-01T00:00:00Z"}
    assert "spaces=appDataFolder" in r["url"]
    assert "q=" in r["url"]
    assert r["authHeader"] == "Bearer tok-abc"


def test_find_sync_file_returns_null_when_nothing_exists_yet(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const fetchImpl = async () => ({ ok: true, json: async () => ({ files: [] }) });
        return await m.findSyncFile('tok', { fetchImpl });
        """,
    )
    assert r is None


def test_download_sync_file_requests_alt_media_with_bearer_token(page, local_server):
    r = _run(
        page,
        local_server,
        """
        let seen = null;
        const fetchImpl = async (url, options) => {
            seen = { url, options };
            return { ok: true, json: async () => ({ clients: [{ id: 'c1' }] }) };
        };
        const content = await m.downloadSyncFile('tok-xyz', 'file123', { fetchImpl });
        return { content, url: seen.url, authHeader: seen.options.headers.Authorization };
        """,
    )
    assert r["content"] == {"clients": [{"id": "c1"}]}
    assert r["url"].endswith("/files/file123?alt=media")
    assert r["authHeader"] == "Bearer tok-xyz"


def test_create_sync_file_posts_multipart_with_appdatafolder_parent(page, local_server):
    r = _run(
        page,
        local_server,
        """
        let seen = null;
        const fetchImpl = async (url, options) => {
            seen = { url, options };
            return { ok: true, json: async () => ({ id: 'new-file-id' }) };
        };
        const result = await m.createSyncFile('tok', { clients: [] }, { fetchImpl });
        return {
            result,
            url: seen.url,
            method: seen.options.method,
            contentType: seen.options.headers['Content-Type'],
            bodyHasParent: seen.options.body.includes('appDataFolder'),
            bodyHasFilename: seen.options.body.includes(m.SYNC_FILENAME),
            bodyHasContent: seen.options.body.includes('"clients":[]'),
        };
        """,
    )
    assert r["result"] == {"id": "new-file-id"}
    assert r["method"] == "POST"
    assert "uploadType=multipart" in r["url"]
    assert r["contentType"].startswith("multipart/related; boundary=")
    assert r["bodyHasParent"] is True
    assert r["bodyHasFilename"] is True
    assert r["bodyHasContent"] is True


def test_update_sync_file_patches_media_only_with_json_body(page, local_server):
    r = _run(
        page,
        local_server,
        """
        let seen = null;
        const fetchImpl = async (url, options) => {
            seen = { url, options };
            return { ok: true, json: async () => ({}) };
        };
        await m.updateSyncFile('tok', 'file123', { clients: [{ id: 'c1' }] }, { fetchImpl });
        return {
            url: seen.url,
            method: seen.options.method,
            contentType: seen.options.headers['Content-Type'],
            body: JSON.parse(seen.options.body),
        };
        """,
    )
    assert r["url"].endswith("/files/file123?uploadType=media")
    assert r["method"] == "PATCH"
    assert r["contentType"] == "application/json"
    assert r["body"] == {"clients": [{"id": "c1"}]}


def test_a_non_ok_response_throws_with_status_and_url_in_the_message(
    page, local_server
):
    r = _run(
        page,
        local_server,
        """
        const fetchImpl = async () => ({ ok: false, status: 403, text: async () => 'forbidden' });
        try {
            await m.findSyncFile('tok', { fetchImpl });
            return { threw: false };
        } catch (e) {
            return { threw: true, message: e.message };
        }
        """,
    )
    assert r["threw"] is True
    assert "403" in r["message"]
