SRC = wasm/SparseArray.cpp\
	wasm/Entity.cpp\
	wasm/Utils.cpp\
	wasm/Registry.cpp

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

$(TS_NAME) $(JS_NAME) $(WASM_NAME): LDFLAGS += -s MODULARIZE=1
$(TS_NAME) $(JS_NAME) $(WASM_NAME) &: $(OBJ)
	@mkdir -p $(OUT_DIR)
	$(CC) $(OBJ) $(LDFLAGS) --emit-tsd libecs-tmp.d.ts -o $(JS_NAME)
	cat build/pre.ts > $(TS_NAME)
	cat $(OUT_DIR)/libecs-tmp.d.ts >> $(TS_NAME)
	$(RM) $(OUT_DIR)/libecs-tmp.d.ts


clean:
	$(RM) $(OBJ)
	$(RM) $(JS_NAME) $(WASM_NAME)

fclean: clean

re: fclean all

.PHONY: re fclean all clean
