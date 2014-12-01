#!/usr/bin/python

'''
    
'''

import sys
import json

states = json.loads(open(sys.argv[1]).read())
counties = json.loads(open(sys.argv[2]).read())

stateIds = {}

for s in states["features"]:
    stateIds[s["id"]] = s["properties"]["name"]

for c in counties["features"]:
    c["properties"]["name"] = c["properties"]["name"] + ", " + stateIds[c["id"][:2]]

outputData = json.dumps(counties)

outputFile = open("outputJSON.json", "w")
print >> outputFile, outputData
outputFile.close()



