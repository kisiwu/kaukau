TESTS = test/tests
PARAMS = test/parameters

#
# Node Module
#

node_modules: package.json
	@npm install

#
# Tests
#

test: test-node

test-node: node_modules
	@printf "==> [Test :: Node.js]\n"
	@NODE_ENV=test ./bin/kaukau \
		-d $(TESTS) \
		--params $(PARAMS) \
		--logs

#
# Clean up
#

clean: clean-node

clean-node:
	@rm -rf node_modules


.PHONY: test test-node
.PHONY: clean clean-node
