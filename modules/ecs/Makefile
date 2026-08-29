SRC = wasm/SparseArray.cpp\
	wasm/Entity.cpp\
	wasm/Utils.cpp\
	wasm/Registry.cpp

NAME := libecs

CFLAGS = -std=c++20
LDFLAGS = -O3 --no-entry --bind -sNO_DISABLE_EXCEPTION_CATCHING -sEXPORT_EXCEPTION_HANDLING_HELPERS

CC = em++

OBJ = $(SRC:.cpp=.o)

BASE_DIR = build
WEB_DIR = lib/web
NODE_DIR = lib/node

%.o: %.cpp
	$(CC) -c $< -o $@ $(CFLAGS)

all: base web node

base: LDFLAGS += -s MODULARIZE=1
base: $(OBJ)
	$(CC) $(OBJ) $(LDFLAGS) --emit-tsd $(NAME)-tmp.d.ts -o $(BASE_DIR)/$(NAME).js
	cat $(BASE_DIR)/pre.ts > $(BASE_DIR)/$(NAME).d.ts
	cat $(BASE_DIR)/libecs-tmp.d.ts >> $(BASE_DIR)/$(NAME).d.ts
	$(RM) $(BASE_DIR)/$(NAME)-tmp.d.ts $(BASE_DIR)/$(NAME).js $(BASE_DIR)/$(NAME).wasm

web: LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT=web
web: $(OBJ)
	@mkdir -p $(WEB_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(WEB_DIR)/$(NAME).js
	cp $(BASE_DIR)/$(NAME).d.ts $(WEB_DIR)/$(NAME).d.ts

node: LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT=node
node: $(OBJ)
	@mkdir -p $(NODE_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(NODE_DIR)/$(NAME).js
	cp $(BASE_DIR)/$(NAME).d.ts $(NODE_DIR)/$(NAME).d.ts

tests: LDFLAGS += -s MODULARIZE=1 -s EXPORT_ES6=1
tests: $(OBJ)
	@mkdir -p $(WEB_DIR) $(NODE_DIR)
	$(CC) $(OBJ) $(LDFLAGS) -o $(WEB_DIR)/$(NAME).js
	cp $(BASE_DIR)/$(NAME).d.ts $(WEB_DIR)/$(NAME).d.ts
	sed -i 's/@nanoforge-dev\/common-legacy/@nanoforge-dev\/common/' $(WEB_DIR)/$(NAME).d.ts
	cp $(WEB_DIR)/$(NAME).js $(NODE_DIR)/$(NAME).js
	cp $(WEB_DIR)/$(NAME).wasm $(NODE_DIR)/$(NAME).wasm
	cp $(WEB_DIR)/$(NAME).d.ts $(NODE_DIR)/$(NAME).d.ts

clean:
	$(RM) $(OBJ)
	$(RM) -r lib

fclean: clean

re: fclean all

.PHONY: re fclean all clean tests web node
