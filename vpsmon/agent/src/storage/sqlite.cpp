#include "storage/sqlite.hpp"

#include <stdexcept>
#include <string>

namespace {

void finalizeStatement(sqlite3_stmt* stmt) {
    if (stmt != nullptr) {
        sqlite3_finalize(stmt);
    }
}

}  // namespace

Database::Database(const std::string& path)
    : db_(nullptr) {
    if (sqlite3_open(path.c_str(), &db_) != SQLITE_OK) {
        throwError("sqlite3_open");
    }

    try {
        exec("PRAGMA journal_mode=WAL;");
        exec("PRAGMA foreign_keys=ON;");
        exec("PRAGMA synchronous=NORMAL;");
    } catch (...) {
        sqlite3_close(db_);
        db_ = nullptr;
        throw;
    }
}

Database::~Database() {
    if (db_ != nullptr) {
        sqlite3_close(db_);
        db_ = nullptr;
    }
}

void Database::exec(const std::string& sql) {
    exec(sql, {});
}

void Database::exec(const std::string& sql, const Parameters& params) {
    sqlite3_stmt* stmt = prepare(sql);

    try {
        bindParameters(stmt, params);

        const int rc = sqlite3_step(stmt);
        if (rc != SQLITE_DONE) {
            finalizeStatement(stmt);
            throwError("sqlite3_step exec");
        }

        finalizeStatement(stmt);
    } catch (...) {
        finalizeStatement(stmt);
        throw;
    }
}

Database::QueryResult Database::query(const std::string& sql) {
    return query(sql, {});
}

Database::QueryResult Database::query(const std::string& sql, const Parameters& params) {
    sqlite3_stmt* stmt = prepare(sql);
    QueryResult rows;

    try {
        bindParameters(stmt, params);

        int rc = SQLITE_ROW;
        while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
            Row row;
            const int columnCount = sqlite3_column_count(stmt);
            for (int index = 0; index < columnCount; ++index) {
                const char* name = sqlite3_column_name(stmt, index);
                const unsigned char* value = sqlite3_column_text(stmt, index);
                row[name != nullptr ? name : ""] = value != nullptr ? reinterpret_cast<const char*>(value) : "";
            }
            rows.push_back(row);
        }

        if (rc != SQLITE_DONE) {
            finalizeStatement(stmt);
            throwError("sqlite3_step query");
        }

        finalizeStatement(stmt);
        return rows;
    } catch (...) {
        finalizeStatement(stmt);
        throw;
    }
}

void Database::beginTransaction() {
    exec("BEGIN TRANSACTION;");
}

void Database::commit() {
    exec("COMMIT;");
}

void Database::rollback() {
    exec("ROLLBACK;");
}

bool Database::integrityCheck() {
    const QueryResult result = query("PRAGMA integrity_check;");
    if (result.empty()) {
        throw std::runtime_error("integrity check returned no rows");
    }

    const auto it = result.front().find("integrity_check");
    if (it == result.front().end()) {
        throw std::runtime_error("integrity check result missing integrity_check column");
    }

    return it->second == "ok";
}

sqlite3_stmt* Database::prepare(const std::string& sql) {
    sqlite3_stmt* stmt = nullptr;
    const int rc = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        throwError("sqlite3_prepare_v2");
    }
    return stmt;
}

void Database::bindParameters(sqlite3_stmt* stmt, const Parameters& params) {
    for (std::size_t index = 0; index < params.size(); ++index) {
        const int rc = sqlite3_bind_text(
            stmt,
            static_cast<int>(index + 1),
            params[index].c_str(),
            -1,
            SQLITE_TRANSIENT
        );
        if (rc != SQLITE_OK) {
            throwError("sqlite3_bind_text");
        }
    }
}

[[noreturn]] void Database::throwError(const std::string& context) const {
    const char* message = db_ != nullptr ? sqlite3_errmsg(db_) : "database handle unavailable";
    throw std::runtime_error(context + ": " + std::string(message != nullptr ? message : "unknown sqlite error"));
}
