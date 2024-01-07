function convert_timestamp(tag, timestamp, record)
     if record["ts"] then
        record["ts"] = os.date("!%Y-%m-%d %H:%M:%S", record["ts"])
    end
    return 1, timestamp, record
end
