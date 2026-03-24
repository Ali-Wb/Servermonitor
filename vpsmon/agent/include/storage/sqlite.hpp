#pragma once

#include <sqlite3.h>

#include <string>
#include <unordered_map>
#include <vector>

class Database {
public:
    using Row = std::unordered_map<std::string, std::string>;
    using QueryResult = std::vector<Row>;
    using Parameters = std::vector<std::string>;

    explicit Database(const std::string& path);
    ~Database();

    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    void exec(const std::string& sql);
    void exec(const std::string& sql, const Parameters& params);

    QueryResult query(const std::string& sql);
    QueryResult query(const std::string& sql, const Parameters& params);

    void beginTransaction();
    void commit();
    void rollback();
    bool integrityCheck();

private:
    sqlite3* db_;

    sqlite3_stmt* prepare(const std::string& sql);
    void bindParameters(sqlite3_stmt* stmt, const Parameters& params);
    [[noreturn]] void throwError(const std::string& context) const;
};
