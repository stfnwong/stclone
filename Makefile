# Makefile for ShaderToy clone 
# 
#

# OUTPUT DIRS
BIN_DIR=bin
OBJ_DIR=obj
SRC_DIR=src
TEST_DIR=test
TEST_BIN_DIR=$(BIN_DIR)/test
PROGRAM_DIR=tools

# Platform specific GL libs 
ifeq ($(shell uname -s), Darwin)
	GLLIBS=-framework OpenGL -framework GLUT -lGLEW
else
	GLLIBS=-lGL -lGLU -lglut -lGLEW
endif

# Tool options
CXX=g++
OPT=-O0
CXXFLAGS=-Wall -pedantic -g2 -std=c++17 -D_REENTRANT $(OPT)
TESTFLAGS=
LDFLAGS=-pthread
LIBS = $(GLLIBS)
TEST_LIBS=


.PHONY: clean

SOURCES = $(wildcard $(SRC_DIR)/*.cpp)
INCLUDES = $(wildcard $(SRC_DIR)/*.hpp)
# Objects 
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp $(INCLUDES)
	$(CXX) -c $< -o $@ $(CXXFLAGS)

OBJECTS := $(SOURCES:$(SRC_DIR)/%.cpp=$(OBJ_DIR)/%.o)
$(OBJECTS): $(OBJ_DIR)/%.o : $(SRC_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@


# Main targets 
all : program

program: $(OBJECTS) 
	$(CXX) $(LDFLAGS) $(OBJECTS)  -o $(BIN_DIR)/$@ $(LIBS) $(TEST_LIBS)

clean:
	rm -rfv *.o $(OBJ_DIR)/*.o 

print-%:
	@echo $* = $($*)
