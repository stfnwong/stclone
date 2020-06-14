# Makefile for ShaderToy clone 
# 
#

# OUTPUT DIRS
BIN_DIR=bin
OBJ_DIR=obj
SRC_DIR=src
TEST_DIR=test
TEST_BIN_DIR=$(BIN_DIR)/test
TOOL_DIR=tools

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

# Objects 
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp $(DEPS)
	$(CXX) -c $< -o $@ $(CXXFLAGS)

OBJECTS := $(SOURCES:$(SRC_DIR)/%.cpp=$(OBJ_DIR)/%.o)
$(OBJECTS): $(OBJ_DIR)/%.o : $(SRC_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Unit tests 
#TEST_OBJECTS  := $(TEST_SOURCES:$(TEST_DIR)/%.cpp=$(OBJ_DIR)/%.o)
#$(TEST_OBJECTS): $(OBJ_DIR)/%.o : $(TEST_DIR)/%.cpp 
#	$(CXX) $(CXXFLAGS) $(INCS) -c $< -o $@ 

# Main targets 
all : program

program: $(OBJECTS) 

clean:
	rm -rfv *.o $(OBJ_DIR)/*.o 

print-%:
	@echo $* = $($*)
