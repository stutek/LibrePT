# tests/unit/test_zap_workdir.py
# The ZAP stage mounts a scratch directory as the container's /zap/wrk, not deploy/zap/ itself. The
# container must be able to WRITE there: zap-baseline.py writes its plan (zap.yaml) there, and the
# stage's wrapper copies ZAP's own log there, which is the only record of why a scan exited 3. With
# the read-only mount it replaced, three failures in five weeks left no cause to read.
#
# Pinned here: what the container is given. Docker and ZAP themselves are not tested.

import os
import stat

from build import prepare_zap_workdir


def _conf(tmp_path):
    conf = tmp_path / "conf"
    conf.mkdir()
    (conf / "zap-baseline.conf").write_text(
        "10035\tIGNORE\t(reason)\n", encoding="utf-8"
    )
    return conf


def test_the_scan_gets_the_configuration_in_a_directory_any_user_can_write(tmp_path):
    """The container runs as uid 1000; a GitHub runner owns the directory as uid 1001."""
    conf = _conf(tmp_path)
    work = prepare_zap_workdir(str(conf), str(tmp_path / "reports" / "zap-wrk"))

    assert (tmp_path / "reports" / "zap-wrk" / "zap-baseline.conf").read_text(
        encoding="utf-8"
    ) == (conf / "zap-baseline.conf").read_text(encoding="utf-8")
    assert os.path.isabs(work)
    mode = stat.S_IMODE(os.stat(work).st_mode)
    assert mode & 0o007 == 0o007, f"others cannot write to it: {oct(mode)}"


def test_each_run_starts_without_the_previous_runs_log_and_leaves_the_source_alone(
    tmp_path,
):
    """A zap.log left from an earlier run would be printed as this run's cause."""
    conf = _conf(tmp_path)
    work_dir = tmp_path / "zap-wrk"
    prepare_zap_workdir(str(conf), str(work_dir))
    (work_dir / "zap.log").write_text("an earlier run\n", encoding="utf-8")
    (work_dir / "zap-baseline.conf").write_text(
        "edited by the container\n", encoding="utf-8"
    )

    prepare_zap_workdir(str(conf), str(work_dir))

    assert sorted(p.name for p in work_dir.iterdir()) == ["zap-baseline.conf"]
    assert (
        (work_dir / "zap-baseline.conf").read_text(encoding="utf-8").startswith("10035")
    )
    assert sorted(p.name for p in conf.iterdir()) == ["zap-baseline.conf"]
