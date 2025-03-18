SRC = wasm/SparseArray.cpp\
	wasm/Entity.cpp\
	wasm/Utils.cpp\
	wasm/Registry.cpp

NAME := libecs

OUT_DIR = public
JS_NAME = $(OUT_DIR)/$(NAME).js
HTML_NAME = $(OUT_DIR)/$(NAME).html
WASM_NAME = $(OUT_DIR)/$(NAME).wasm
TS_NAME = $(NAME).d.ts

CFLAGS = -std=c++20
LDFLAGS = -O3 --no-entry --bind

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@ $(CFLAGS)

all: $(WASM_NAME)

js: $(JS_NAME)

html: $(HTML_NAME)

ts: $(TS_NAME)

$(WASM_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(WASM_NAME)

$(JS_NAME): LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s STANDALONE_WASM=1
$(JS_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(JS_NAME)

$(HTML_NAME): LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s STANDALONE_WASM=1
$(HTML_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(HTML_NAME)

$(TS_NAME): LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1
$(TS_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) --emit-tsd $(TS_NAME) -o $(JS_NAME)

clean:
	$(RM) $(OBJ)
	$(RM) -r $(OUT_DIR)
	$(RM) $(JS_NAME) $(WASM_NAME) $(HTML_NAME) $(TS_NAME)

fclean: clean

tests: LDFLAGS += -s MODULARIZE=1 -s STANDALONE_WASM=1
tests: $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(JS_NAME)

re: fclean all

.PHONY: re fclean all clean tests
