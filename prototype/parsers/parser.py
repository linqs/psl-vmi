import os 
import re
import json

# Helper file to calcualate weighted sat from jasons sat.txt file
# this would not be used later as we can get weighted sat output from PSL
# but this is to learn the pipeline from PSL -> viz

DATA_DIR = "../data/"
DATA_FILE = "../sat.txt/"

#def grab_weighted_sat():
#    WEIGHT_INDEX = 0
#    SAT_INDEX = 1
#    print("Opening " + DATA_DIR + DATA_FILE)
#    satisfaction_file = open(DATA_DIR + DATA_FILE, "r")
#    weight_sat_pattern = r'(\d*\.\d*)+'
#    rule_pattern = r'\((.*)'
#    #TODO: Make rule regex so that we can make a json thats : rule  weightedSat
#    
#    weighted_sat_list = []
#    for line in satisfaction_file:
#        num_match = re.findall(weight_sat_pattern, line)
#        if len(num_match) > 2:
#            continue
#        if num_match:
#            weight = float(num_match[WEIGHT_INDEX])
#            sat = float(num_match[SAT_INDEX])
#            cutoff = (len(num_match[SAT_INDEX]))
#            no_sat = str(line[0:len(line)-1 - cutoff]) #get rid of sat on end so we can regex
#            rule_match = re.findall(rule_pattern, no_sat)
#            
#            rule_match = rule_match[0][:-3]
#            weighted_sat = weight * sat
#            weighted_sat_list.append({'weighted_sat' : weighted_sat, 'rule' : rule_match})



existingNodes = []
rule_output = []
links = []
logical_rule = "("  #Else it is arithmetic rule
negated = "~"
def output_data():
    with open('../node_new.json', 'w') as df:
        rule_output.reverse()
        json.dump(rule_output, df, indent = 4)

    with open('../link_new.json', 'w') as df:
        json.dump(links,df, indent = 4)
        

obs_dicts = {}
likes_Obs = {}
unobservedAtoms = []
unobVal = {}
before_underscore_pattern = r"^(.*?)\_"

def find_unobserved_atoms(predicates):
    for filename in os.listdir(DATA_DIR + "inferred-predicates"):
        if filename.endswith(".txt"): 
            file = os.path.splitext(filename)[0]
            with open(DATA_DIR + "/inferred-predicates/" + filename, 'r') as target:
                for line in target:
                    constants = line.strip().split("\t")
                    unobserved = file.upper() + "(\'" + constants[0] + '\', \'' +constants[1]+ '\')'
                    unobVal[unobserved] = str(float(constants[2]))
                    unobservedAtoms.append(unobserved)
    
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".txt"): 
            file = os.path.splitext(filename)[0]
            before_underscore = re.match(before_underscore_pattern, file)
            if before_underscore is not None:
                #group 1 should be non-underscore
                predicate = before_underscore.group(1)
                #TODO: Dont like how this works, try and fix later
                # Using this none to make it so open predicates dont get added to obs_dicts
                pred_dict = None
                if (predicates[predicate.upper()][1] == 'closed'):
                    pred_dict = {}
                    with open(DATA_DIR + filename, 'r') as target:
                        for line in target:
                            constants = line.strip().split("\t")
                            unobserved = predicate.upper() + '(' + "'" + constants[0] + "'"+ ', ' + "'"+constants[1]+"'"+ ')'
                            if len(constants) > 2:
                                likes_Obs[unobserved] = constants[2]  
                                pred_dict[unobserved] = constants[2]
                            else:
                                likes_Obs[unobserved] = 1
                                pred_dict[unobserved] = 1
                 
                if pred_dict is not None:
                    obs_dicts[predicate.upper()] = pred_dict
                            
        
def findPredicates():
    with open('../simple-acquaintances.data', 'r') as data:
        predicate = {}
        data = data.read().strip()
        data = data.split("\n\n")

        predicates = data[0].split('\n')[1:]
        i = 1;
        for pred in predicates:
          
            open_closed = pred.split(':')[1].strip()  #Finding open / closed predicate
            pred = pred.strip().split('/')  #Finding predicate name
            predicate[pred[0].upper()] = [i, open_closed]
            i+=1
                    
    return predicate    


def findLogicalRules(rules, Group, satisfaction, weighted_sat):
    groundAtoms = []  #List containing the ground atoms
    rules = rules[1:-1] #Getting rid of the first and last parenthesis
    rules = rules.strip()
    groundRules = rules.split(" | ")
    
    num_unobserved = 0
    #Grabbing each ground atom
    for atoms in groundRules:
     
        # If ground atom has negation in front, parse out and just grab the ground atom within
        if atoms[0] == negated:
            groundAtom = atoms[3:-2]  # Obtain the ground atom for negated atoms
        else:
            groundAtom = atoms

        predicate_group = groundAtom.split("(")[0]  #Getting the predicate and making it "case insensitive"
#        print(predicate_group)
        if groundAtom not in existingNodes:
            
            atom_data = {'groundAtom': groundAtom, 'group': Group[predicate_group][0], 'type': Group[predicate_group][1]}
            if groundAtom in unobservedAtoms:
                #TODO: values in unobservedAtoms dont have quotes around them
                atom_data['value'] = unobVal[groundAtom]
                atom_data['unobserved'] = True
                num_unobserved +=1  # Keeping track of number of unobserved atoms in the rule
            else:
                keys = obs_dicts.keys()
                if predicate_group in keys:
#                    print('here')
#                    print(obs_dicts[predicate_group][groundAtom])
                    atom_data['value'] = obs_dicts[predicate_group][groundAtom]
                else:
                    atom_data['value'] = 1
                atom_data['unobserved'] = False
            
            rule_output.append(atom_data)
            existingNodes.append(groundAtom)
            
        groundAtoms.append(groundAtom)

    if num_unobserved > 1 :
        links.append({'source': groundAtoms[0], 'target': groundAtoms[1], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat})
        links.append({'source': groundAtoms[0], 'target': groundAtoms[2], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat}) 
        links.append({'source': groundAtoms[1], 'target': groundAtoms[2], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat})
        
    else:
        if groundAtoms[0] in unobservedAtoms:
            links.append({'source': groundAtoms[1], 'target': groundAtoms[0], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat})
            links.append({'source': groundAtoms[2], 'target': groundAtoms[0], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat}) 
        elif groundAtoms[1] in unobservedAtoms:
            links.append({'source': groundAtoms[0], 'target': groundAtoms[1], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat})
            links.append({'source': groundAtoms[2], 'target': groundAtoms[1], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat}) 
        else:
            links.append({'source': groundAtoms[1], 'target': groundAtoms[2], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat})
            links.append({'source': groundAtoms[0], 'target': groundAtoms[2], 'rule': rules, 'satisfaction': satisfaction, 'weighted_satisfaction' : weighted_sat}) 


def main():    
    with open('../data/sat.txt', 'r') as data:
        predicateGroup = findPredicates()       #Getting predicate node group 
        find_unobserved_atoms(predicateGroup)
#        print(unobVal)
#        print(unobservedAtoms)
#        print(unobVal)
#       print(obs_dicts)
        for line in data:
            line = line.strip()
            data_split = line.split("\t")
#            print(data_split)
            
            weights = data_split[0]
            if weights == 'Weight':
                continue
            if weights == '.':
                weights = 0
            satisfaction = data_split[3]
            weighted_sat = str(float(weights) * float(satisfaction))
            rules = data_split[2]
            if rules[0] == logical_rule:
                findLogicalRules(rules, predicateGroup, satisfaction, weighted_sat)
    
    output_data()
  
if __name__== "__main__":
  main()