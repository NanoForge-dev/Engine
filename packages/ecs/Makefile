SRC = wasm/SparseArray.cpp

NAME := libecs

OUT_DIR = public
JS_NAME = $(OUT_DIR)/$(NAME).js
HTML_NAME = $(OUT_DIR)/$(NAME).html
WASM_NAME = $(OUT_DIR)/$(NAME).wasm
TS_TYPES = $(OUT_DIR)/$(NAME).d.ts

CFLAGS += -O3 --no-entry --bind

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@

all: $(WASM_NAME)

js: $(JS_NAME)

html: $(HTML_NAME)

ts: $(TS_TYPES)

$(WASM_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(CFLAGS) -o $(WASM_NAME)

$(JS_NAME): CFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s STANDALONE_WASM=1
$(JS_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(CFLAGS) -o $(JS_NAME)

$(HTML_NAME): CFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s STANDALONE_WASM=1
$(HTML_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(CFLAGS) -o $(HTML_NAME)

$(TS_TYPES): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) --bind --emit-tsd $(TS_TYPES)

clean:
	$(RM) $(OBJ)
	$(RM) -r $(OUT_DIR)
	$(RM) $(JS_NAME) $(WASM_NAME) $(HTML_NAME) $(TS_TYPES)

fclean: clean

tests: fclean $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) -O3 -s MODULARIZE=1 --bind -o $(JS_NAME)

re: fclean all

.PHONY: re fclean all clean tests
