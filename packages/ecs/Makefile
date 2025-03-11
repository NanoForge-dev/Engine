SRC = wasm/lib.cpp

NAME := libecs

OUT_DIR = public
JS_NAME = $(OUT_DIR)/$(NAME).html
WASM_NAME = $(OUT_DIR)/$(NAME).wasm

CC = em++

OBJ = $(SRC:.cpp=.o)

%.o: %.cpp
	$(CC) -c $< -o $@

all: $(JS_NAME)

$(JS_NAME): $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) -o $(JS_NAME) --bind

clean:
	$(RM) $(OBJ)
	$(RM) -r $(OUT_DIR)
	$(RM) $(JS_NAME) $(WASM_NAME)

fclean: clean

re: fclean all

.PHONY: re fclean all clean $(JS_NAME)
