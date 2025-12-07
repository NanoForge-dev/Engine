BASE_DIR = node_modules/@nanoforge-dev/ecs-lib

SRC = $(BASE_DIR)/wasm/SparseArray.cpp\
	$(BASE_DIR)/wasm/Entity.cpp\
	$(BASE_DIR)/wasm/Utils.cpp\
	$(BASE_DIR)/wasm/Registry.cpp

NAME := libecs

OUT_DIR = lib
JS_NAME = $(OUT_DIR)/$(NAME).js
WASM_NAME = $(OUT_DIR)/$(NAME).wasm
TS_NAME = $(OUT_DIR)/$(NAME).d.ts

CFLAGS = -std=c++20
LDFLAGS = -O3 --no-entry --bind -sNO_DISABLE_EXCEPTION_CATCHING -sEXPORT_EXCEPTION_HANDLING_HELPERS

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@ $(CFLAGS)

all: $(TS_NAME) $(JS_NAME) $(WASM_NAME)

$(TS_NAME) $(JS_NAME) $(WASM_NAME): LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT=web
$(TS_NAME) $(JS_NAME) $(WASM_NAME) &: $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(JS_NAME)
	cp $(BASE_DIR)/$(TS_NAME) $(TS_NAME)

clean:
	$(RM) $(OBJ)
	$(RM) $(JS_NAME) $(WASM_NAME) $(TS_NAME)

fclean: clean

tests: LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1
tests: $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(JS_NAME)
	cp $(BASE_DIR)/$(TS_NAME) $(TS_NAME)

re: fclean all

.PHONY: re fclean all clean tests
