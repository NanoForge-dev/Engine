SRC = wasm/SparseArray.cpp\
	wasm/Registry.cpp

NAME := libecs

OUT_DIR = public
JS_NAME = $(OUT_DIR)/$(NAME).js
HTML_NAME = $(OUT_DIR)/$(NAME).html
WASM_NAME = $(OUT_DIR)/$(NAME).wasm
TS_NAME = $(NAME).d.ts

CFLAGS += -O3 --no-entry --bind

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@

all: $(WASM_NAME)

js: $(JS_NAME)

html: $(HTML_NAME)

ts: $(TS_NAME)

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

$(TS_NAME): CFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s STANDALONE_WASM=1
$(TS_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(CFLAGS) --emit-tsd $(TS_NAME) -o $(JS_NAME)

clean:
	$(RM) $(OBJ)
	$(RM) -r $(OUT_DIR)
	$(RM) $(JS_NAME) $(WASM_NAME) $(HTML_NAME) $(TS_NAME)

fclean: clean

tests: CFLAGS += -s MODULARIZE=1 -s STANDALONE_WASM=1
tests: fclean $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(CFLAGS) -o $(JS_NAME)

re: fclean all

.PHONY: re fclean all clean tests
