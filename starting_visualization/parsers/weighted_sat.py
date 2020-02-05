import os 
import re

# Helper file to calcualate weighted sat from jasons sat.txt file
# this would not be used later as we can get weighted sat output from PSL
# but this is to learn the pipeline from PSL -> viz

DATA_DIR = "../data/"

WEIGHT_INDEX = 0
SAT_INDEX = 1

print("Opening " + DATA_DIR + "sat.txt")
satisfaction_file = open(DATA_DIR + "sat.txt", "r")

weight_sat_pattern = r'(\d*\.\d*)+'

#TODO: Make rule regex so that we can make a json thats : rule  weightedSat

for line in satisfaction_file:
    match = re.findall(weight_sat_pattern, line)
    if len(match) > 2:
        continue
    if match:
        weight = float(match[WEIGHT_INDEX])
        sat = float(match[SAT_INDEX])
        weighted_sat = weight * sat
#        print(weighted_sat)
    