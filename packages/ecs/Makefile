SRC = wasm/lib.cpp

NAME := libecs

OUT_DIR = public
JS_NAME = $(OUT_DIR)/$(NAME).js
HTML_NAME = $(OUT_DIR)/$(NAME).html
WASM_NAME = $(OUT_DIR)/$(NAME).wasm

CFLAGS += -O3 --no-entry --bind

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@

all: $(WASM_NAME)

js: $(JS_NAME)

html: $(HTML_NAME)

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

clean:
	$(RM) $(OBJ)
	$(RM) -r $(OUT_DIR)
	$(RM) $(JS_NAME) $(WASM_NAME)

fclean: clean

re: fclean all

.PHONY: re fclean all clean
