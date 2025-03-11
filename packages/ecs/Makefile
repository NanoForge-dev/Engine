SRC := wasm/lib.cpp

NAME := libecs

JS_NAME = $(NAME).js
WASM_NAME = $(NAME).wasm

CC := emcc

CFLAGS := -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap"]'

all: $(JS_NAME)

$(JS_NAME):
	$(CC) $(SRC) $(CFLAGS) -o $(JS_NAME)

clean:
	$(RM) $(JS_NAME) $(WASM_NAME)

fclean: clean

re: fclean all

.PHONY: re fclean all clean $(JS_NAME)
