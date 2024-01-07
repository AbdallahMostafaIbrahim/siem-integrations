CREATE TABLE zeek.conn (
    timestamp DateTime,
    uid String,
    source_ip IPv4,
    source_port UInt16,
    destination_ip IPv4,
    destination_port UInt16,
    protocol String,
    service String,
    duration Float64,
    orig_bytes UInt64,
    resp_bytes UInt64,
    conn_state String,
    local_orig UInt8,
    local_resp UInt8,
    missed_bytes UInt64,
    history String,
    orig_pkts UInt64,
    orig_ip_bytes UInt64,
    resp_pkts UInt64,
    resp_ip_bytes UInt64
) ENGINE = MergeTree()
ORDER BY (timestamp, uid);


CREATE TABLE zeek.ssh (
    timestamp DateTime,
    uid String,
    source_ip IPv4,
    source_port UInt16,
    destination_ip IPv4,
    destination_port UInt16,
    auth_attempts UInt8,
    direction String,
    client String
) ENGINE = MergeTree()
ORDER BY (timestamp, uid);

CREATE TABLE zeek.dns (
    timestamp DateTime,
    uid String,
    source_ip IPv4,
    source_port UInt16,
    destination_ip IPv4,
    destination_port UInt16,
    protocol String,
    trans_id UInt16,
    query Nullable(String),
    rcode Int8,
    rcode_name String,
    AA UInt8,
    TC UInt8,
    RD UInt8,
    RA UInt8,
    Z UInt8,
    answers Array(String),
    TTLs Array(Float32),
    rejected UInt8
) ENGINE = MergeTree()
ORDER BY (timestamp, uid);


CREATE TABLE zeek.http (
    timestamp DateTime,
    uid String,
    source_ip IPv4,
    source_port UInt16,
    destination_ip IPv4,
    destination_port UInt16,
    trans_depth UInt16,
    method String,
    host String,
    uri String,
    referrer Nullable(String),
    user_agent String,
    request_body_len UInt64,
    response_body_len UInt64,
    tags Array(String),
    origin Nullable(String),
    orig_fuids Array(String),
    orig_mime_types Array(String)
) ENGINE = MergeTree()
ORDER BY (timestamp, uid);
