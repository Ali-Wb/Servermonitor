#include "sqlite3.h"

#include <stdlib.h>
#include <string.h>

struct sqlite3 {
    char error[64];
};

struct sqlite3_stmt {
    int stepped;
};

int sqlite3_open(const char* filename, sqlite3** ppDb) {
    (void)filename;
    *ppDb = (sqlite3*)calloc(1, sizeof(sqlite3));
    if (*ppDb == NULL) {
        return SQLITE_ERROR;
    }
    strcpy((*ppDb)->error, "ok");
    return SQLITE_OK;
}

int sqlite3_close(sqlite3* db) {
    free(db);
    return SQLITE_OK;
}

const char* sqlite3_errmsg(sqlite3* db) {
    if (db == NULL) {
        return "sqlite stub error";
    }
    return db->error;
}

int sqlite3_prepare_v2(sqlite3* db, const char* zSql, int nByte, sqlite3_stmt** ppStmt, const char** pzTail) {
    (void)db;
    (void)zSql;
    (void)nByte;
    if (pzTail != NULL) {
        *pzTail = NULL;
    }
    *ppStmt = (sqlite3_stmt*)calloc(1, sizeof(sqlite3_stmt));
    return *ppStmt == NULL ? SQLITE_ERROR : SQLITE_OK;
}

int sqlite3_finalize(sqlite3_stmt* pStmt) {
    free(pStmt);
    return SQLITE_OK;
}

int sqlite3_step(sqlite3_stmt* pStmt) {
    if (pStmt == NULL) {
        return SQLITE_ERROR;
    }
    if (pStmt->stepped) {
        return SQLITE_DONE;
    }
    pStmt->stepped = 1;
    return SQLITE_DONE;
}

int sqlite3_bind_text(sqlite3_stmt* pStmt, int i, const char* zData, int n, sqlite3_destructor_type xDel) {
    (void)pStmt;
    (void)i;
    (void)zData;
    (void)n;
    (void)xDel;
    return SQLITE_OK;
}

int sqlite3_column_count(sqlite3_stmt* pStmt) {
    (void)pStmt;
    return 0;
}

const char* sqlite3_column_name(sqlite3_stmt* pStmt, int N) {
    (void)pStmt;
    (void)N;
    return "";
}

const unsigned char* sqlite3_column_text(sqlite3_stmt* pStmt, int iCol) {
    (void)pStmt;
    (void)iCol;
    return (const unsigned char*)"";
}
