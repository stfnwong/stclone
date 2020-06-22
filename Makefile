# Makefile for ShaderToy clone 
# 
#

# OUTPUT DIRS
BIN_DIR=bin
OBJ_DIR=obj
SRC_DIR=src
TEST_DIR=test
TEST_BIN_DIR=$(BIN_DIR)
PROGRAM_DIR=program

# Platform specific GL libs 
ifeq ($(shell uname -s), Darwin)
	GLLIBS=-framework OpenGL -lGLEW -lSDL2 
else
	GLLIBS=-lSDL2 -lGLEW -lGL
endif

# Tool options
CXX=g++
OPT=-O0
CXXFLAGS=-Wall -pedantic -g2 -std=c++17 -D_REENTRANT $(OPT) -I$(SRC_DIR)
TESTFLAGS=
LDFLAGS=-pthread
LIBS = $(GLLIBS)
TEST_LIBS=
INCS=-I$(SRC_DIR)


.PHONY: clean all test program

SOURCES = $(wildcard $(SRC_DIR)/*.cpp)
INCLUDES = $(wildcard $(SRC_DIR)/*.hpp)

# Objects 
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp 
	$(CXX) -c $< -o $@ $(CXXFLAGS)

OBJECTS := $(SOURCES:$(SRC_DIR)/%.cpp=$(OBJ_DIR)/%.o)
$(OBJECTS): $(OBJ_DIR)/%.o : $(SRC_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Unit tests 
TEST_SOURCES = $(wildcard $(TEST_DIR)/*.cpp)
TEST_OBJECTS  := $(TEST_SOURCES:$(TEST_DIR)/%.cpp=$(OBJ_DIR)/%.o)

$(TEST_OBJECTS): $(OBJ_DIR)/%.o : $(TEST_DIR)/%.cpp 
	$(CXX) $(CXXFLAGS)  -c $< -o $@ 

# ==== TEST TARGETS ==== #
TESTS=test_shader
$(TESTS): $(TEST_OBJECTS) $(OBJECTS) 
	$(CXX) $(LDFLAGS) $(OBJECTS) $(OBJ_DIR)/$@.o\
		-o $(TEST_BIN_DIR)/$@ $(LIBS) $(TEST_LIBS)


# ==== PROGRAM TARGETS ==== #
PROGRAMS=main
PROGRAM_SOURCES = $(wildcard $(PROGRAM_DIR)/*.cpp)
PROGRAM_OBJECTS = $(PROGRAM_SOURCES:$(PROGRAM_DIR)/%.cpp=$(OBJ_DIR)/%.o)

$(PROGRAM_OBJECTS) : $(OBJ_DIR)/%.o : $(PROGRAM_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(PROGRAMS): $(OBJECTS) $(PROGRAM_OBJECTS) 
	$(CXX) $(LDFLAGS) $(OBJECTS) $(OBJ_DIR)/$@.o\
		-o $(BIN_DIR)/$@ $(LIBS) $(TEST_LIBS)

# Main targets 
all : program test

test: $(TESTS)

program: $(PROGRAMS)

#program: $(OBJECTS) main.o
#	$(CXX) $(LDFLAGS) $(OBJECTS) -o $(BIN_DIR)/$@ $(LIBS) $(TEST_LIBS)

clean:
	rm -rfv *.o $(OBJ_DIR)/*.o 

print-%:
	@echo $* = $($*)
