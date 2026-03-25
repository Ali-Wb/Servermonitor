CXX := g++
CC := gcc
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -Iinclude -Ivendor/sqlite3
CFLAGS := -Wall -Wextra -O2 -Iinclude -Ivendor/sqlite3
LDFLAGS := -lpthread -ldl
TLS_FLAGS := -DVPSMON_TLS=1
TLS_LIBS := -lssl -lcrypto
NCURSES_LIBS := -lncurses
PREFIX ?= /usr/local
BUILD_DIR := build
BIN_DIR := $(BUILD_DIR)/bin
OBJ_DIR := $(BUILD_DIR)/obj
DEP_DIR := $(BUILD_DIR)/dep
SQLITE_C := vendor/sqlite3/sqlite3.c
SQLITE_OBJ := $(OBJ_DIR)/vendor/sqlite3/sqlite3.o
AGENT_BIN := $(BIN_DIR)/vpsmon-agent
TUI_BIN := $(BIN_DIR)/vpsmon-tui
TUI_TLS_BIN := $(BIN_DIR)/vpsmon-tui-tls
COLOR_OK := \033[32m
COLOR_RESET := \033[0m
OK_MARK := $(COLOR_OK)✓$(COLOR_RESET)

AGENT_SOURCES := $(wildcard src/*.cpp src/storage/*.cpp src/collectors/*.cpp src/server/*.cpp src/alerts/*.cpp src/alerts/channels/*.cpp src/config/*.cpp src/util/*.cpp)
AGENT_SOURCES := $(filter-out src/util/self_updater.cpp,$(AGENT_SOURCES))
ifeq ($(TLS),1)
CXXFLAGS += $(TLS_FLAGS)
LDFLAGS += $(TLS_LIBS)
AGENT_SOURCES += src/util/self_updater.cpp
endif
TUI_SOURCES := $(wildcard tui/*.cpp)
COMMON_TUI_SOURCES := $(filter-out src/main.cpp,$(AGENT_SOURCES))
AGENT_OBJECTS := $(patsubst %.cpp,$(OBJ_DIR)/%.o,$(AGENT_SOURCES))
TUI_OBJECTS := $(patsubst %.cpp,$(OBJ_DIR)/%.o,$(COMMON_TUI_SOURCES) $(TUI_SOURCES))
DEPS := $(AGENT_OBJECTS:.o=.d) $(TUI_OBJECTS:.o=.d) $(SQLITE_OBJ:.o=.d)

.PHONY: all tui tui-tls clean install install-tui test

all: $(AGENT_BIN)
	@printf '$(OK_MARK) Built %s\n' '$(AGENT_BIN)'

tui: $(TUI_BIN)
	@printf '$(OK_MARK) Built %s\n' '$(TUI_BIN)'

tui-tls: $(TUI_TLS_BIN)
	@printf '$(OK_MARK) Built %s\n' '$(TUI_TLS_BIN)'

$(AGENT_BIN): $(AGENT_OBJECTS) $(SQLITE_OBJ)
	@mkdir -p $(BIN_DIR)
	$(CXX) $(AGENT_OBJECTS) $(SQLITE_OBJ) -o $@ $(LDFLAGS)

$(TUI_BIN): $(TUI_OBJECTS) $(SQLITE_OBJ)
	@mkdir -p $(BIN_DIR)
	$(CXX) $(TUI_OBJECTS) $(SQLITE_OBJ) -o $@ $(LDFLAGS) $(NCURSES_LIBS)

$(TUI_TLS_BIN): CXXFLAGS += $(TLS_FLAGS)
$(TUI_TLS_BIN): $(TUI_OBJECTS) $(SQLITE_OBJ)
	@mkdir -p $(BIN_DIR)
	$(CXX) $(TUI_OBJECTS) $(SQLITE_OBJ) -o $@ $(LDFLAGS) $(NCURSES_LIBS) $(TLS_LIBS)

$(OBJ_DIR)/%.o: %.cpp
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -MMD -MP -c $< -o $@

$(SQLITE_OBJ): $(SQLITE_C)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

clean:
	rm -rf $(BUILD_DIR)
	@printf '$(OK_MARK) Cleaned build artifacts\n'

install: $(AGENT_BIN)
	install -d $(PREFIX)/bin
	install -m 0755 $(AGENT_BIN) $(PREFIX)/bin/vpsmon-agent
	@printf '$(OK_MARK) Installed %s\n' '$(PREFIX)/bin/vpsmon-agent'

install-tui: $(TUI_BIN)
	install -d $(PREFIX)/bin
	install -m 0755 $(TUI_BIN) $(PREFIX)/bin/vpsmon-tui
	@printf '$(OK_MARK) Installed %s\n' '$(PREFIX)/bin/vpsmon-tui'

test:
	@if [ -z "$(wildcard tests/*.cpp)" ]; then \
		printf '$(OK_MARK) No C++ tests defined yet\n'; \
	else \
		printf '$(OK_MARK) Test target placeholder reached\n'; \
	fi

-include $(DEPS)
