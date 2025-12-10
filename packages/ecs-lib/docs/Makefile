all: sphinx

doxygen:
	doxygen Doxyfile

sphinx: doxygen
	sphinx-build -b html . doc_out/sphinx/

clean:
	rm -rf doc_out/

.PHONY: all doxygen sphinx
