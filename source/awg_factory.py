'''
Created on May 15, 2018

@author: 4x1md

Update of original file on Nov. 17 2018 by Dundarave to add entries needed for FY6600 support.
'''

from awgdrivers.dummy_awg import DummyAWG
from awgdrivers.fy6900 import FY6900

class AwgFactory(object):
    
    def __init__(self):
        self.awgs = {}
    
    def add_awg(self, short_name, awg_class):
        self.awgs[short_name] = awg_class
        
    def get_class_by_name(self, short_name):
        return self.awgs[short_name]

# Initialize factory
awg_factory = AwgFactory()
awg_factory.add_awg(DummyAWG.SHORT_NAME, DummyAWG)
awg_factory.add_awg(FY6900.SHORT_NAME, FY6900)

